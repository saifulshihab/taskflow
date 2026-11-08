"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Check } from "lucide-react";
import { Children, isValidElement, useState, type ReactNode } from "react";

// Declarative option data for the shared shadcn Select. No native select/option
// elements are rendered; names and selected values participate in FormData.
export function SelectOption(props: { value?: string; children: ReactNode }) {
  void props;
  return null;
}
export function SelectControl({
  children,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  onChange?: (event: { target: { value: string } }) => unknown;
}) {
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children: ReactNode }>(child))
      return [];
    const label = child.props.children;
    return [{ value: child.props.value ?? String(label), label }];
  });
  return (
    <Select
      items={options}
      value={value}
      defaultValue={
        defaultValue ?? (value === undefined ? options[0]?.value : undefined)
      }
      name={name}
      disabled={disabled}
      required={required}
      onValueChange={(next) => {
        onChange?.({ target: { value: next ?? "" } });
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={`h-9 min-w-28 text-xs   ${className ?? ""}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="" align="start" alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CheckControl({
  checked,
  defaultChecked,
  onChange,
  disabled,
  name,
  "aria-label": ariaLabel,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  onChange?: (event: { target: { checked: boolean } }) => unknown;
}) {
  return (
    <Checkbox
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      name={name}
      aria-label={ariaLabel}
      onCheckedChange={(next) => {
        onChange?.({ target: { checked: next } });
      }}
    />
  );
}

export function DateControl({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (event: { target: { value: string } }) => unknown;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="submit"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-xs"
          />
        }
      >
        <CalendarIcon size={15} />
        {date ? format(date, "MMM d, yyyy") : "Set due date"}
      </PopoverTrigger>
      <PopoverContent className="   w-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(next) => {
            onChange({
              target: { value: next ? format(next, "yyyy-MM-dd") : "" },
            });
            setOpen(false);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onChange({ target: { value: "" } });
            setOpen(false);
          }}
        >
          Clear date
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const colors = [
  "#0E7490",
  "#7C3AED",
  "#15803D",
  "#B45309",
  "#BE185D",
  "#57534E",
  "#1D4ED8",
  "#4338CA",
];
export function ColorControl({
  name,
  defaultValue = colors[0],
  disabled,
  "aria-label": ariaLabel = "Color",
}: {
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <>
      <Input type="hidden" name={name} value={value} />
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={ariaLabel}
              className="size-9 p-1 [&>span]:size-6 [&>span]:rounded-md"
            />
          }
        >
          <span style={{ background: value }} />
        </PopoverTrigger>
        <PopoverContent className="w-60 space-y-3" align="start">
          <div className="grid grid-cols-4 gap-2 [&>button]:size-9 [&>button]:p-0 [&>button]:text-white">
            {colors.map((color) => (
              <Button
                variant="outline"
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={color === value}
                style={{ background: color }}
                onClick={() => setValue(color)}
              >
                {color === value && <Check size={14} />}
              </Button>
            ))}
          </div>
          <Input
            aria-label="Hex color"
            value={value}
            pattern="#[0-9a-fA-F]{6}"
            maxLength={7}
            onChange={(e) => setValue(e.target.value)}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
