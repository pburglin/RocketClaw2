export function buildFloatingFooterRender(line: string): string {
  return `\x1b[s\r\x1b[2K${line}\x1b[u`;
}

export function buildFloatingFooterClear(): string {
  return '\x1b[s\r\x1b[2K\x1b[u';
}
