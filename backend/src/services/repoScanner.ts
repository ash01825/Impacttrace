import * as fs from "fs";
import * as path from "path";
import { RepoContext, ServiceInfo, SharedModuleInfo } from "../types";

interface ScanResult {
  repoContext: RepoContext;
  fileTree: string[];
  warnings: string[];
}

const SOURCE_EXTS = new Set([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"]);
const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage",
  "__pycache__", ".venv", "venv", "vendor", ".turbo", ".cache",
]);

export function scanRepository(rootPath: string): ScanResult {
  const resolvedRoot = path.resolve(rootPath);
  if (!fs.existsSync(resolvedRoot)) {
    throw new Error(`Repository path does not exist: ${resolvedRoot}`);
  }

  const stat = fs.statSync(resolvedRoot);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolvedRoot}`);
  }

  const warnings: string[] = [];
  const allFiles: string[] = [];

  walkDirectory(resolvedRoot, resolvedRoot, allFiles, warnings);

  // Build per-file dependency + export maps
  const fileDeps = new Map<string, Set<string>>();
  const fileExports = new Map<string, Set<string>>();

  for (const file of allFiles) {
    const deps = extractImportsExports(file, resolvedRoot);
    fileDeps.set(rel(file, resolvedRoot), deps.imports);
    fileExports.set(rel(file, resolvedRoot), deps.exports);
  }

  // Group files into services at the right level
  const services = buildServices(resolvedRoot, allFiles, fileDeps, fileExports, warnings);

  // Build shared modules
  const sharedModules = buildSharedModules(allFiles, fileDeps, services);

  return {
    repoContext: { services, sharedModules },
    fileTree: allFiles.map((f) => rel(f, resolvedRoot)),
    warnings,
  };
}

function walkDirectory(
  rootPath: string,
  currentDir: string,
  allFiles: string[],
  warnings: string[]
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    warnings.push(`Cannot read directory: ${rel(currentDir, rootPath)}`);
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(rootPath, fullPath, allFiles, warnings);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SOURCE_EXTS.has(ext) || isConfigFile(entry.name)) {
        allFiles.push(fullPath);
      }
    }
  }
}

function isConfigFile(filename: string): boolean {
  return /\.(json|yaml|yml|toml)$/.test(filename) || /schema/i.test(filename);
}

interface ImportExportResult {
  imports: Set<string>;
  exports: Set<string>;
}

function extractImportsExports(filePath: string, rootPath: string): ImportExportResult {
  const imports = new Set<string>();
  const exports = new Set<string>();

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { imports, exports };
  }

  const fileDir = path.dirname(filePath);

  // Parse require() calls and ES imports
  const requireRe = /(?:require|from)\s*\(?\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = requireRe.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith(".")) {
      const resolved = resolveImport(fileDir, importPath, rootPath);
      if (resolved) imports.add(resolved);
    }
  }

  // Parse fs.readFileSync(path.join(__dirname, ...)) — behavioral contract detection
  const fsReadRe = /(?:readFileSync|readFile|existsSync)\s*\(\s*(?:path\s*\.\s*join\s*\(\s*__dirname\s*,\s*)?['"]([^'"]+)['"]/g;
  while ((match = fsReadRe.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith(".")) {
      const resolved = resolveImport(fileDir, importPath, rootPath);
      if (resolved) imports.add(resolved);
    }
  }

  // module.exports = { a, b, c }
  const moduleExportsObj = content.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
  if (moduleExportsObj) {
    const body = moduleExportsObj[1];
    const names = body.match(/\w+/g);
    if (names) names.forEach((n) => exports.add(n));
  }

  // module.exports.x = ...
  const dotExportRe = /module\.exports\.(\w+)\s*=/g;
  while ((match = dotExportRe.exec(content)) !== null) {
    exports.add(match[1]);
  }

  // ES exports
  const esExportRe = /export\s+(?:const|function|class|interface|type|enum|let|var|async\s+function|default\s+function|default\s+class)\s+(\w+)/g;
  while ((match = esExportRe.exec(content)) !== null) {
    exports.add(match[1]);
  }

  // exports.x = ...
  const namedExportRe = /exports\.(\w+)\s*=/g;
  while ((match = namedExportRe.exec(content)) !== null) {
    exports.add(match[1]);
  }

  return { imports, exports };
}

function resolveImport(
  fromDir: string,
  importPath: string,
  rootPath: string
): string | null {
  const candidates = [
    path.resolve(fromDir, importPath),
    path.resolve(fromDir, importPath + ".js"),
    path.resolve(fromDir, importPath + ".ts"),
    path.resolve(fromDir, importPath + ".jsx"),
    path.resolve(fromDir, importPath + ".tsx"),
    path.resolve(fromDir, importPath + ".mjs"),
    path.resolve(fromDir, importPath, "index.js"),
    path.resolve(fromDir, importPath, "index.ts"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return rel(candidate, rootPath);
      }
    } catch {
      // skip
    }
  }

  return null;
}

function buildServices(
  rootPath: string,
  allFiles: string[],
  fileDeps: Map<string, Set<string>>,
  fileExports: Map<string, Set<string>>,
  warnings: string[]
): ServiceInfo[] {
  // Group files by their directory tree, finding the right service boundary.
  // Heuristic: a directory is a "service" if it contains source files directly
  // AND is not just a container of other service dirs.
  // We group at the deepest level that still contains source files.

  // Build a tree: for each directory, track which files it contains
  const dirFiles = new Map<string, string[]>();
  const dirSubdirs = new Map<string, Set<string>>();

  for (const file of allFiles) {
    const dir = path.dirname(file);
    const dirRel = rel(dir, rootPath);

    if (!dirFiles.has(dirRel)) dirFiles.set(dirRel, []);
    dirFiles.get(dirRel)!.push(file);
  }

  // Build subdirectory relationships
  for (const [dir] of dirFiles) {
    const parent = path.dirname(dir);
    const parentRel = rel(parent, rootPath);
    if (parentRel !== dir) {
      if (!dirSubdirs.has(parentRel)) dirSubdirs.set(parentRel, new Set());
      dirSubdirs.get(parentRel)!.add(dir);
    }
  }

  // Find service boundaries: directories that contain source files AND
  // whose subdirectories either don't exist or are very small
  const serviceDirs = new Set<string>();

  for (const [dir, files] of dirFiles) {
    if (dir === "" || dir === ".") continue;

    const subdirs = dirSubdirs.get(dir);
    const hasSubdirsWithFiles = subdirs && [...subdirs].some((sd) => {
      const sdFiles = dirFiles.get(sd);
      return sdFiles && sdFiles.length > 0;
    });

    // If dir has source files and no subdirs with files, it's a leaf service
    // If dir has subdirs with files, it's a container — skip it
    if (!hasSubdirsWithFiles && files.length > 0) {
      serviceDirs.add(dir);
    }
  }

  // If no service dirs found (monorepo), fall back to grouping by first-level dir
  if (serviceDirs.size === 0) {
    for (const file of allFiles) {
      const relPath = rel(file, rootPath);
      const parts = relPath.split("/");
      if (parts.length >= 2) {
        serviceDirs.add(parts[0] + "/" + parts[1]);
      } else if (parts.length === 1) {
        serviceDirs.add(parts[0]);
      }
    }
  }

  // Group files by which service dir they belong to
  const serviceGroups = new Map<string, string[]>();

  for (const file of allFiles) {
    const fileRel = rel(file, rootPath);

    // Find the deepest ancestor service dir this file belongs to
    let bestMatch = "";
    let bestLen = 0;
    for (const sd of serviceDirs) {
      if ((fileRel === sd || fileRel.startsWith(sd + "/")) && sd.length > bestLen) {
        bestMatch = sd;
        bestLen = sd.length;
      }
    }

    if (bestMatch) {
      if (!serviceGroups.has(bestMatch)) serviceGroups.set(bestMatch, []);
      serviceGroups.get(bestMatch)!.push(file);
    }
  }

  const services: ServiceInfo[] = [];

  for (const [dir, files] of serviceGroups) {
    if (files.length === 0) continue;

    const name = path.basename(dir);
    const allExports = new Set<string>();
    const allDeps = new Set<string>();
    let hasSourceFiles = false;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (SOURCE_EXTS.has(ext)) hasSourceFiles = true;

      const relFile = rel(file, rootPath);
      const exps = fileExports.get(relFile);
      const deps = fileDeps.get(relFile);
      if (exps) exps.forEach((e) => allExports.add(e));
      if (deps) deps.forEach((d) => allDeps.add(d));
    }

    // Skip directories that only contain config files (no source code)
    if (!hasSourceFiles) continue;

    // Filter deps external to this service
    const externalDeps = [...allDeps].filter(
      (d) => !d.startsWith(dir + "/")
    );

    const exportList = [...allExports];
    services.push({
      name,
      path: dir,
      description: `${name} — ${files.length} files. ${exportList.length > 0 ? `Exports: ${exportList.slice(0, 6).join(", ")}.` : ""}`,
      exports: exportList.slice(0, 20),
      dependencies: externalDeps.slice(0, 20),
    });
  }

  return services;
}

function buildSharedModules(
  allFiles: string[],
  fileDeps: Map<string, Set<string>>,
  services: ServiceInfo[]
): SharedModuleInfo[] {
  // Track which files are imported by which services
  const consumedBy = new Map<string, Set<string>>();

  for (const service of services) {
    for (const dep of service.dependencies) {
      if (!consumedBy.has(dep)) consumedBy.set(dep, new Set());
      consumedBy.get(dep)!.add(service.name);
    }
  }

  const sharedModules: SharedModuleInfo[] = [];

  for (const [file, consumers] of consumedBy) {
    const isConfig = isConfigFile(path.basename(file));

    // Shared: consumed by 2+ services, or is a config/schema consumed by at least 1
    if (consumers.size >= 2 || (isConfig && consumers.size >= 1)) {
      sharedModules.push({
        name: path.basename(file, path.extname(file)),
        path: file,
        description: isConfig
          ? `Shared ${path.extname(file)} consumed independently by ${[...consumers].join(", ")}. This is a potential behavioral contract.`
          : `Consumed by ${[...consumers].join(", ")}.`,
        consumedBy: [...consumers],
      });
    }
  }

  return sharedModules;
}

function rel(filePath: string, rootPath: string): string {
  const r = path.relative(rootPath, filePath);
  return r.replace(/\\/g, "/");
}
