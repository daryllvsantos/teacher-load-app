export type ActionResult = {
  status: "idle" | "success" | "error";
  message?: string;
};