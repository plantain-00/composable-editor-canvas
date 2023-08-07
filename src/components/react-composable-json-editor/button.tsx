import * as React from "react";
import { buttonStyle, labelStyle } from "./common";

/**
 * @public
 */
export function Button(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>): JSX.Element {
  return <button {...props} style={{ ...buttonStyle, ...props.style }}> {props.children}</button >
}

export function Label(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLSpanElement>, HTMLSpanElement>): JSX.Element {
  return <span {...props} style={{ ...labelStyle, ...props.style }}> {props.children}</span >
}
