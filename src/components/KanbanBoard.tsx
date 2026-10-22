'use client';

import { useState } from 'react';
import type { Job, PipelineStage } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { setJobStage, removeFromPipeline } from '@/lib/storage';

interface Props {
  jobs: Job[];
  pipeline: Record<string, { stage: PipelineStage; date: string }>;
  onUpdate: () => void;
  onOpenJob: (job: Job) => void;
}

// Helper: determine stage for a job
function getJobStage(job: Job, pipeline: Record<string, { stage: PipelineStage; date: string }>): PipelineStage {
  return pipeline[job.id]?.stage || (job.applied ? 'applied' : job.bookmarked ? 'saved' : null as any);
}

export default function KanbanBoard({ jobs, pipeline, onUpdate, onOpenJob }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);

  const jobsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = jobs.filter(j => {
      const s = pipeline[j.id]?.stage;
      if (s) return s === stage.id;
      // Auto-categorize: bookmarked → saved, applied → applied (unless they have an explicit stage)
      if (stage.id === 'saved') return j.bookmarked && !j.applied && !pipeline[j.id];
      if (stage.id === 'applied') return j.applied && !pipeline[j.id];
      return false;
    });
    return acc;
  }, {} as Record<PipelineStage, Job[]>);

  const totalCount = Object.values(jobsByStage).reduce((s, arr) => s + arr.length, 0);

  const handleDragStart = (jobId: string) => setDragId(jobId);
  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOver(stage);
  };
  const handleDrop = (stage: PipelineStage) => {
    if (dragId) {
      setJobStage(dragId, stage);
      onUpdate();
    }
    setDragId(null);
    setDragOver(null);
  };

  const handleRemove = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    removeFromPipeline(jobId);
    onUpdate();
  };

  if (totalCount === 0) {
    return (
      <div className="sheet p-10">
        <h3 className="display text-3xl mb-2">Pipeline is clear</h3>
        <p className="text-sm max-w-md" style={{ color: 'var(--muted)' }}>
          Save a listing or mark it applied. It will land here so you can move it by hand.
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-px" style={{ background: 'var(--line)' }}>
          {PIPELINE_STAGES.map(s => (
            <div key={s.id} className="p-3" style={{ background: 'var(--sheet)' }}>
              <div className="kicker">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {PIPELINE_STAGES.map(stage => {
          const stageJobs = jobsByStage[stage.id];
          const isOver = dragOver === stage.id;
          return (
            <div
              key={stage.id}
              className={`column flex flex-col ${isOver ? 'is-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="kicker" style={{ color: 'var(--ink)' }}>{stage.label}</h3>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                    {stageJobs.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {stageJobs.map(job => {
                  const stageData = pipeline[job.id];
                  const initials = job.company.split(/[\s.-]+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
                  return (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={() => handleDragStart(job.id)}
                      onClick={() => onOpenJob(job)}
                      className="sheet p-3 cursor-grab active:cursor-grabbing group"
                      style={{ borderLeft: '3px solid var(--ink)' }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mark" style={{ width: 32, height: 32, fontSize: 13 }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-sm leading-tight truncate" title={job.title}>
                              {job.title}
                            </h4>
                            <button
                              onClick={(e) => handleRemove(e, job.id)}
                              className="opacity-0 group-hover:opacity-100 text-xs"
                              style={{ color: 'var(--accent)' }}
                              title="Remove from pipeline"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{job.company}</p>
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {job.type === 'freelance' && <span className="source-badge">Free</span>}
                            {job.isRemote && <span className="source-badge">Remote</span>}
                            {stageData?.date && stage.id !== 'saved' && (
                              <span className="text-[10px] ml-auto" style={{ color: 'var(--muted)' }}>
                                {new Date(stageData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stageJobs.length === 0 && (
                  <div className="text-center text-xs py-8" style={{ color: 'var(--muted)', border: '1px dashed var(--line)' }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>Drag a card between columns.</p>
    </div>
  );
}
