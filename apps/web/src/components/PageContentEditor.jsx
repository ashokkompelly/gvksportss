import { useData, State } from './ui';
import { pageDefaults } from '../../../../shared/siteContent';
import VisualPageEditor from './VisualPageEditor';
export const PageContentEditor = VisualPageEditor;
export default function PageContentManager({ slug, onAddEvent }) {
  const { data, error, reload } = useData('/admin/pages');
  const page = data?.find((item) => item.slug === slug);
  return (
    <State data={data} error={error}>
      {data && (
        <PageContentEditor
          key={slug + '-' + (page?.id || 'new')}
          item={page || pageDefaults[slug]}
          onAddEvent={onAddEvent}
          onSave={() => {
            reload();
          }}
        />
      )}
    </State>
  );
}
