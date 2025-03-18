import type { SVGProps } from "react"

export default function UniversityLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-university-primary"
      {...props}
    >
      <path d="M22 20V8h-4l-6-4-6 4H2v12h4v-9l6-4 6 4v9h4Z" />
      <path d="M6 12h4" />
      <path d="M14 12h4" />
      <path d="M10 12v8" />
      <path d="M14 12v8" />
      <path d="M6 20h12" />
    </svg>
  )
}

