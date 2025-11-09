'use client'

type Props = { md: string }

export default function MarkdownMini({ md }: Props) {
  // very light parser: headings, bold, bullets, line-breaks
  const html = md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-300">$1</strong>')
    .replace(/^\- (.+)$/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br />')

  return <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: html }} />
}