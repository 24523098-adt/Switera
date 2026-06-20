import useRipple from "../hooks/useRipple";

function Tombol({ label, variant = "primer", onClick, type = "button", disabled = false, style }) {
  const { ripples, onMouseDown, removeRipple } = useRipple();

  return (
    <button
      type={type}
      className={`tombol tombol-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseDown={onMouseDown}
    >
      {label}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-span"
          style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        />
      ))}
    </button>
  );
}

export default Tombol;
