import { execFileSync } from "node:child_process";

const maxBytes = 1_000_000;
const changes = execFileSync(
  "git",
  ["diff", "--cached", "--raw", "--no-abbrev", "--no-renames", "--diff-filter=AMT", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .slice(0, -1);

for (let index = 0; index < changes.length; index += 2) {
  const [, mode, , objectId] = changes[index].split(" ");
  // 子模块记录的是提交引用，不是文件内容。
  if (mode === "160000") continue;

  const size = Number(execFileSync("git", ["cat-file", "-s", objectId], { encoding: "utf8" }));
  if (size > maxBytes) {
    console.error(
      `无法提交：${JSON.stringify(changes[index + 1])} 为 ${size} 字节，超过 1 MB（${maxBytes} 字节）上限。`,
    );
    process.exitCode = 1;
  }
}
