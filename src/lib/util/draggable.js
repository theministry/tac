import { get } from "svelte/store"
import { pos, dragging, moved } from "$lib/stores/map"

let o = { x: 0, y: 0 };

export function startDrag(e) {
  let { x, y } = get(pos);
  dragging.set(true);
  o.x = (e.pageX + x);
  o.y = (e.pageY + y);
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);
}

export function drag(e) {
  moved.set(true);
  let x = -(e.pageX - o.x);
  let y = -(e.pageY - o.y);
  pos.moveTo({x, y});
  e.preventDefault();
}

export function endDrag(e) {
  moved.set(false);
  dragging.set(false);
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("mouseup", endDrag);
  document.removeEventListener("touchend", endDrag);
}