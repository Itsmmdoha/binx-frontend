import * as React from "react"

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      ref,
    })
  }

  if (React.Children.count(children) > 1) {
    React.Children.only(null)
  }

  return null
})
Slot.displayName = "Slot"

export { Slot }
