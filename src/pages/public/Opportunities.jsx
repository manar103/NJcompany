import { useMemo, useState } from 'react';
import { useLocation } from '../../lib/router';
import { useDocumentTitle, useQuery, useSession, useStore } from '../../lib/hooks';
import { jobs as jobsApi, filterJobs } from '../../services/api';
import JobCard from '../../components/jobs/JobCard';
import FilterPanel, { EMPTY_FILTERS, FILTER_GROUPS, optionLabel } from '../../components/jobs/FilterPanel';
import { Button, Drawer, EmptyState, ErrorState, Icon, IconButton, LoadingCards, SampleBadge, Select } from '../../components/ui';
import { t, tn, tx } from '../../i18n';

function initialFilters(query) {
  const f = { ...EMPTY_FILTERS };
  if (query.get('q')) f.q = query.get('q');
  if (query.get('category')) f.categories = [query.get('category')];
  return f;
}

/** Opportunity discovery — used on the public site and inside the dashboard (`inApp`). */
export default function Opportunities({ inApp = false }) {
  useDocumentTitle(t('Find Opportunities'));
  const { query } = useLocation();
  const [filters, setFilters] = useState(() => initialFilters(query));
  const [drawer, setDrawer] = useState(false);
  const { data: all, loading, error, reload } = useQuery(() => jobsApi.all());
  const user = useSession();
  const myApps = useStore((s) => s.applications);
  const appliedIds = useMemo(() => new Set(myApps.filter((a) => user && a.userId === user.id && a.status !== 'withdrawn').map((a) => a.jobId)), [myApps, user]);

  const results = useMemo(() => (all ? filterJobs(all, filters) : []), [all, filters]);
  const openJobs = useMemo(() => (all || []).filter((j) => j.status === 'open'), [all]);
  const chips = FILTER_GROUPS.flatMap((g) => filters[g.key].map((v) => ({ key: g.key, value: v, label: optionLabel(g.key, v) })));
  const activeCount = chips.length;
  const removeChip = (c) => setFilters({ ...filters, [c.key]: filters[c.key].filter((v) => v !== c.value) });
  const clearAll = () => setFilters({ ...EMPTY_FILTERS, sort: filters.sort });
  const basePath = inApp ? '/app/opportunities' : '/opportunities';

  const header = (
    <div className={inApp ? 'page-head' : 'listing-hero'}>
      <div className={inApp ? '' : 'container'}>
        {!inApp && <span className="eyebrow">{t('Opportunities')}</span>}
        <h1>{t('Find opportunities that fit your skills')}</h1>
        <p>{t('Browse projects by category, language and work type. Every listing shows its requirements up front.')}</p>
        <form className="search-bar" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group grow">
            <Icon name="search" />
            <label htmlFor="job-search" className="sr-only">
              {t('Search opportunities')}
            </label>
            <input
              id="job-search"
              className="input"
              type="search"
              placeholder={t('Search by title, skill or language')}
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={inApp ? '' : 'listing-page'}>
      {header}
      <div className={inApp ? 'listing-layout' : 'container listing-layout'}>
        <aside className="listing-filters" aria-label={t('Filters')}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <h2 className="filters-title">{t('Filters')}</h2>
            {activeCount > 0 && (
              <button type="button" className="link-btn small" onClick={clearAll}>
                {t('Clear all')}
              </button>
            )}
          </div>
          <FilterPanel filters={filters} onChange={setFilters} allJobs={openJobs} />
        </aside>

        <section className="listing-results" aria-labelledby="results-heading">
          <div className="results-bar">
            <div className="row" style={{ gap: 10 }}>
              <Button variant="secondary" size="sm" icon="sliders" className="filters-toggle" onClick={() => setDrawer(true)}>
                {t('Filters')}{activeCount > 0 && ` (${activeCount})`}
              </Button>
              <h2 id="results-heading" className="results-count" aria-live="polite">
                {loading ? t('Loading opportunities…') : error ? t('Results unavailable') : tn(results.length, '{n} opportunity', '{n} opportunities')}
              </h2>
              <SampleBadge />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <label htmlFor="sort" className="small subtle">
                {t('Sort by')}
              </label>
              <Select id="sort" style={{ width: 'auto', minHeight: 36 }} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} options={[{ value: 'newest', label: t('Newest') }, { value: 'relevance', label: t('Relevance') }]} />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="chips" aria-label={t('Active filters')}>
              {chips.map((c) => (
                <span className="chip" key={c.key + c.value}>
                  {c.label}
                  <button type="button" onClick={() => removeChip(c)} aria-label={t('Remove filter {label}', { label: c.label })}>
                    <Icon name="x" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <LoadingCards count={4} />
          ) : error ? (
            <div className="card">
              <ErrorState title={t('We couldn’t load opportunities')} onRetry={reload}>
                {error.message}
              </ErrorState>
            </div>
          ) : results.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="search"
                title={t('No opportunities match your filters')}
                actions={
                  <>
                    <Button variant="secondary" onClick={clearAll}>
                      {t('Clear filters')}
                    </Button>
                    {filters.q && <Button variant="ghost" onClick={() => setFilters({ ...filters, q: '' })}>{t('Clear search')}</Button>}
                  </>
                }
              >
                {t('Try removing a filter or searching for a broader term. New projects are added regularly.')}
              </EmptyState>
            </div>
          ) : (
            <div className="job-grid">
              {results.map((j) => (
                <JobCard key={j.id} job={j} basePath={basePath} applied={appliedIds.has(j.id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} label={t('Filters')}>
        <div className="drawer-head">
          <strong>{t('Filters')}</strong>
          <IconButton icon="x" label={t('Close filters')} onClick={() => setDrawer(false)} />
        </div>
        <div style={{ padding: '8px 20px 20px' }}>
          <FilterPanel filters={filters} onChange={setFilters} allJobs={openJobs} />
        </div>
        <div className="drawer-foot">
          <Button variant="secondary" onClick={clearAll}>
            {t('Clear all')}
          </Button>
          <Button onClick={() => setDrawer(false)}>{t('Show {n} results', { n: results.length })}</Button>
        </div>
      </Drawer>
    </div>
  );
}
