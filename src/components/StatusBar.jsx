import { GitBranchIcon } from './icons.jsx'

export default function StatusBar({ projectCount }) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <GitBranchIcon /> main
        </span>
        <span className="status-item">
          {projectCount} projet{projectCount > 1 ? 's' : ''}
        </span>
      </div>
      <div className="status-right">
        <span className="status-item">Markdown</span>
        <span className="status-item">UTF-8</span>
        <span className="status-item">Vercel</span>
      </div>
    </div>
  )
}
