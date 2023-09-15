interface InputFieldProps
  extends React.PropsWithChildren,
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    > {
  label: string
  type: React.HTMLInputTypeAttribute
  value?: string | ReadonlyArray<string> | number
  required?: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function InputField({
  label,
  onChange,
  required,
  type,
  value,
  ...props
}: InputFieldProps): JSX.Element {
  return (
    <div {...props}>
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      <input
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        type={type}
        autoComplete="1"
        value={value}
        required={required}
        onChange={onChange}
      />
    </div>
  )
}
