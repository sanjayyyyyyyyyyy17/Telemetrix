export default function DataCard({ children, className = "", as: Comp = "div", ...rest }) {
  return (
    <Comp
      {...rest}
      className={`panel p-5 transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,191,255,0.06)] ${className}`}
    >
      {children}
    </Comp>
  )
}
