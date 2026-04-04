import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, AlertCircle, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FAQ_DATA } from '../data/faq'
import { TROUBLESHOOTING_DATA } from '../data/troubleshooting'
import { TEAM_SETUP_GUIDE } from '../data/team-setup-guide'

type Tab = 'faq' | 'troubleshooting' | 'setup'

export function HelpPage() {
  const [activeTab, setActiveTab] = useState<Tab>('faq')
  const [search, setSearch] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<Set<number>>(new Set())

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const query = search.toLowerCase()

  const filteredFaq = useMemo(
    () => FAQ_DATA.filter((f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)),
    [query]
  )

  const filteredTroubleshooting = useMemo(
    () => TROUBLESHOOTING_DATA.filter((t) => t.problem.toLowerCase().includes(query) || t.solution.toLowerCase().includes(query)),
    [query]
  )

  const showSetup = !query || TEAM_SETUP_GUIDE.toLowerCase().includes(query)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'faq', label: 'FAQ' },
    { key: 'troubleshooting', label: 'Troubleshooting' },
    { key: 'setup', label: 'Team Setup' },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help Center</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Find answers, troubleshoot issues, and learn how to set up your team.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help articles..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-2">
          {filteredFaq.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No matching questions found.</p>
          )}
          {filteredFaq.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {expandedFaq.has(i) ? (
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.question}
                </span>
              </button>
              {expandedFaq.has(i) && (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Troubleshooting Tab */}
      {activeTab === 'troubleshooting' && (
        <div className="space-y-3">
          {filteredTroubleshooting.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No matching issues found.</p>
          )}
          {filteredTroubleshooting.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.problem}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Setup Tab */}
      {activeTab === 'setup' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800/50">
          {showSetup ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-li:text-gray-600 dark:prose-li:text-gray-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-200">
              <ReactMarkdown>{TEAM_SETUP_GUIDE}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <BookOpen size={32} className="mb-2" />
              <p className="text-sm">No matching content in the setup guide.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
