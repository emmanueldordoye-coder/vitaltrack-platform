declare module "react-dom" {
  export function useFormState<State>(
    action: (state: State, payload: FormData) => State | Promise<State>,
    initialState: State,
    permalink?: string,
  ): [State, (payload: FormData) => void];

  export function useFormStatus(): {
    pending: boolean;
    data: FormData | null;
    method: string;
    action: string | ((payload: FormData) => void);
  };
}
