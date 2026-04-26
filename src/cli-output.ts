export function buildFooterReserveStart(rows: number): string {
  const scrollBottom = Math.max(1, rows - 1);
  return `\x1b[s\x1b[1;${scrollBottom}r\x1b[u`;
}

export function buildFooterReserveEnd(): string {
  return '\x1b[r';
}

export function buildFloatingFooterRender(line: string): string {
  return `\x1b[s\r\x1b[2K${line}\x1b[u`;
}

export function buildFloatingFooterClear(): string {
  return '\x1b[s\r\x1b[2K\x1b[u';
}

export function buildBottomFooterRender(rows: number, line: string): string {
  return `\x1b[s\x1b[${rows};1H\x1b[2K${line}\x1b[u`;
}

export function buildBottomFooterClear(rows: number): string {
  return `\x1b[s\x1b[${rows};1H\x1b[2K\x1b[u`;
}
