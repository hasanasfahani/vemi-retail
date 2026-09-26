import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "text";
export type ButtonSize = "md" | "sm";

/* The same look for a link that navigates (<a>, next/link): spread the
   class onto it rather than nesting a button inside a link. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  { size = "md", block = false }: { size?: ButtonSize; block?: boolean } = {}
) {
  return cx("vm-btn", `vm-btn--${variant}`, size === "sm" && "vm-btn--sm", block && "vm-btn--block");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One `primary` per view. `secondary` for alternatives, `text` for low emphasis. */
  variant?: ButtonVariant;
  /** `md` is the 44px control. `sm` (36px) only inside dense rows and cards. */
  size?: ButtonSize;
  block?: boolean;
  /** A 16-20px line icon shown before the label. */
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

/** Labels are verbs in sentence case: "Export report". */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, iconStart, iconEnd, className, children, type = "button", ...rest },
  ref
) {
  return (
    <button ref={ref} type={type} className={cx(buttonClass(variant, { size, block }), className)} {...rest}>
      {iconStart && <span className="vm-btn__icon" aria-hidden="true">{iconStart}</span>}
      {children}
      {iconEnd && <span className="vm-btn__icon" aria-hidden="true">{iconEnd}</span>}
    </button>
  );
});

/** An icon-only control. `label` is required: it is the control's name. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "md" | "sm"; children: ReactNode }
>(function IconButton({ label, size = "md", className, children, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx("vm-iconbtn", size === "sm" && "vm-iconbtn--sm", className)}
      {...rest}
    >
      {children}
    </button>
  );
});
