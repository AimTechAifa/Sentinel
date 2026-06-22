"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export interface ServiceNodeData {
  label: string;
  touched: boolean;
  unstable?: boolean;
  selected?: boolean;
}

function ServiceNodeComponent({ data }: NodeProps<ServiceNodeData>) {
  return (
    <div
      className={cn(
        "relative rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        data.selected && "ring-2 ring-brand-500 ring-offset-1"
      )}
      style={{
        background: data.touched ? "#DBEAFE" : "#fff",
        border: data.touched
          ? "2px solid #2563EB"
          : data.unstable
            ? "2px solid #EF4444"
            : "1px solid #E2E8F0",
        fontWeight: data.touched ? 600 : 400,
      }}
    >
      {data.unstable && (
        <span
          className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulseDot ring-2 ring-white"
          aria-label="Unstable service"
        />
      )}
      {data.label}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
