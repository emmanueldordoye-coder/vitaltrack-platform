interface FormMessageProps {
  message: string | null;
  status: "idle" | "success" | "error";
}

export const FormMessage = ({ message, status }: FormMessageProps) => {
  if (!message || status === "idle") {
    return null;
  }

  return (
    <p
      className={
        status === "success" ? "text-sm text-emerald-700" : "text-sm text-rose-700"
      }
    >
      {message}
    </p>
  );
};
