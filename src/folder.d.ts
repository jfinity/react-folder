import { ComponentType, ReactNode } from "react";

export const Monitor: ComponentType<{
  silent?: boolean;
  watch?: (action: { type?: string; payload?: any }) => void;
}>;

type KeyPart = string;

export const Folder: ComponentType<{
  name?: KeyPart;
  children?: ReactNode | ((pwd: string, basename: string) => ReactNode);
}>;

export function mkdir<Props>(
  options: { name?: KeyPart } | null | undefined,
  LOC: ComponentType<
    Props & { folder?: KeyPart; pwd: string; basename: string }
  >
): ComponentType<Props & { folder?: KeyPart }>;

export function usePathname(): string;

export function useDevRenderSignal(label?: string, detail?: any): void;
