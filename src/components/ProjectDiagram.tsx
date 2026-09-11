import { ArrowRight, BookOpen, Braces, ChartNoAxesCombined, Database, FileText, MessageSquare, Radio, Server, Sparkles, Users } from 'lucide-react'
import type { Project } from '../lib/supabase'

// Architecture sketches describe the projects; they are not product screenshots or measured results.
export default function ProjectDiagram({ project }: { project: Project }) {
  const title = project.title.toLowerCase()
  const isForecast = title.includes('viewcast')
  const isWorkspace = title.includes('novahub')
  const isBook = title.includes('book')
  const isChat = title.includes('chat')
  const isCms = title.includes('portfolio') || title.includes('cms')
  const isStudent = title.includes('student') && title.includes('performance')
  const nodes = isForecast
    ? [{ label: 'YouTube data', Icon: Database }, { label: 'LightGBM', Icon: Sparkles }, { label: 'View forecasts', Icon: ChartNoAxesCombined }]
    : isWorkspace
      ? [{ label: 'Workspace', Icon: Users }, { label: 'Socket.IO', Icon: Radio }, { label: 'Live messages', Icon: MessageSquare }]
      : isBook
        ? [{ label: 'Book ratings', Icon: BookOpen }, { label: 'Collaborative filtering', Icon: Sparkles }, { label: 'Recommendations', Icon: BookOpen }]
        : isChat
          ? [{ label: 'PDF documents', Icon: FileText }, { label: 'Semantic search', Icon: Database }, { label: 'Answers', Icon: MessageSquare }]
          : isCms
            ? [{ label: 'Admin CMS', Icon: Braces }, { label: 'Supabase', Icon: Database }, { label: 'Portfolio', Icon: Server }]
            : isStudent
              ? [{ label: 'Student data', Icon: Database }, { label: 'ML pipeline', Icon: Sparkles }, { label: 'Predictions', Icon: ChartNoAxesCombined }]
              : [{ label: 'The problem', Icon: FileText }, { label: 'Engineering', Icon: Braces }, { label: 'The solution', Icon: ArrowRight }]
  const knownArchitecture = isForecast || isWorkspace || isBook || isChat || isCms || isStudent
  return (
    <div className={`pp-project-diagram ${isForecast ? 'pp-diagram-forecast' : ''} ${isWorkspace ? 'pp-diagram-workspace' : ''}`}>
      <div className="pp-diagram-meta"><span>{knownArchitecture ? 'SYSTEM OVERVIEW' : 'PROJECT STUDY'}</span><span>{isWorkspace ? 'EVENT-DRIVEN' : isCms ? 'CONTENT-DRIVEN' : knownArchitecture ? 'DATA-DRIVEN' : 'SOFTWARE ENGINEERING'}</span></div>
      <div className="pp-diagram-nodes">
        {nodes.map(({ label, Icon }, i) => <div className="pp-diagram-step" key={label}>
          <div className="pp-diagram-node"><Icon size={28} strokeWidth={1.3} aria-hidden="true" /><span>{label}</span></div>
          {i < nodes.length - 1 && <span className="pp-diagram-connector" aria-hidden="true"><ArrowRight size={17} /></span>}
        </div>)}
      </div>
      <div className="pp-diagram-footer"><span className="pp-diagram-signal" aria-hidden="true" /><span>{isForecast ? 'Forecast horizons' : 'Architecture'}</span><span>{isForecast ? '07 / 14 / 21 / 30 DAYS' : nodes.map(n => n.label).join(' → ')}</span></div>
    </div>
  )
}
