import { useId } from 'react';
import type { VerbDefinition } from '../../shared/domain/types';
import { Icon } from '../../shared/ui/Icon';
import { mergeDefinitions } from './definitions';
export function VerbDefinitions({
  definitions,
  showSources,
}: {
  definitions?: VerbDefinition[];
  showSources: boolean;
}) {
  const id = useId();
  const groups = mergeDefinitions(definitions);
  if (!groups.length) return null;
  return (
    <section className="vd-definitions" aria-labelledby={id}>
      <h2 id={id}>
        <Icon name="book" size={17} />
        Meaning<span className="vd-definitions-caption">In simple English</span>
      </h2>
      <ol>
        {groups.map((definition, index) => (
          <li key={index}>
            <div className="vd-definition-line">
              <p lang="en">{definition.text}</p>
              <span className="vd-definition-dialects">
                {definition.dialects.map((dialect) => (
                  <span className="tag" key={dialect}>
                    {dialect.toUpperCase()}
                  </span>
                ))}
              </span>
            </div>
            {showSources && (
              <div className="vd-definition-sources">
                {definition.sources.map((source, i) => (
                  <p key={i}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.label || source.url}
                      </a>
                    ) : (
                      source.label
                    )}
                    {source.checkedAt && <> · {source.checkedAt}</>}
                    {source.license && <> · {source.license}</>}
                  </p>
                ))}
                {definition.reviewStatus !== 'validated' && <p>Pendiente de revisión.</p>}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
