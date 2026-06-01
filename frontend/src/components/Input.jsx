import { memo } from "react";

const Input = memo(({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  disabled = false,
  ...props 
}) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    disabled={disabled}
    {...props}
  />
));

Input.displayName = "Input";
export default Input;
