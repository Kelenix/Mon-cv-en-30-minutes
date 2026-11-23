import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Variantes et tailles : docs/design/design-system.md §7 (zones tactiles ≥ 44 px).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent bg-clip-padding text-base font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-strong",
        premium: "bg-premium text-premium-foreground hover:bg-premium/85",
        outline:
          "border-primary bg-background text-primary-strong hover:bg-accent aria-expanded:bg-accent",
        ghost: "text-foreground hover:bg-accent aria-expanded:bg-accent",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-primary-strong underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-13 px-7 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
