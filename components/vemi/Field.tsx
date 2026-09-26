import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "./cx";
import Icon from "./Icon";

type FieldFrame = {
  /** Always visible above the field. A placeholder is never the label. */
  label: ReactNode;
  hint?: ReactNode;
  /** Replaces the hint and marks the field invalid. Write the fix, not the fault. */
  error?: ReactNode;
  optional?: boolean;
};

function Frame({
  id, label, hint, error, optional, className, children,
}: FieldFrame & { id: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx("vm-field", className)}>
      <label htmlFor={id} className="vm-field__label">
        {label}
        {optional && <span className="vm-field__optional"> (optional)</span>}
      </label>
      {children}
      {(error || hint) && (
        <div id={`${id}-help`} className={error ? "vm-field__error" : "vm-field__hint"}>
          {error ?? hint}
        </div>
      )}
    </div>
  );
}

const describe = (id: string, on: boolean) => (on ? `${id}-help` : undefined);

export const TextField = forwardRef<HTMLInputElement, FieldFrame & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, hint, error, optional, id, className, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Frame id={fid} label={label} hint={hint} error={error} optional={optional} className={className}>
        <input
          ref={ref}
          id={fid}
          className={cx("vm-input", Boolean(error) && "vm-input--error")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe(fid, Boolean(error || hint))}
          {...rest}
        />
      </Frame>
    );
  }
);

export const SelectField = forwardRef<HTMLSelectElement, FieldFrame & SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ label, hint, error, optional, id, className, children, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Frame id={fid} label={label} hint={hint} error={error} optional={optional} className={className}>
        <span className="vm-select">
          <select
            ref={ref}
            id={fid}
            className={cx("vm-input", Boolean(error) && "vm-input--error")}
            aria-invalid={error ? true : undefined}
            aria-describedby={describe(fid, Boolean(error || hint))}
            {...rest}
          >
            {children}
          </select>
          <span className="vm-select__chevron"><Icon name="chevron-down" size={16} /></span>
        </span>
      </Frame>
    );
  }
);

export const TextareaField = forwardRef<HTMLTextAreaElement, FieldFrame & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextareaField({ label, hint, error, optional, id, className, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <Frame id={fid} label={label} hint={hint} error={error} optional={optional} className={className}>
        <textarea
          ref={ref}
          id={fid}
          className={cx("vm-input", Boolean(error) && "vm-input--error")}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe(fid, Boolean(error || hint))}
          {...rest}
        />
      </Frame>
    );
  }
);
