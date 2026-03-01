export function TagBadge({ tag, onRemove }) {
  return (
    <span
      style={{ backgroundColor: tag.couleur + '22', borderColor: tag.couleur, color: tag.couleur }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
    >
      {tag.nom}
      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="ml-0.5 leading-none hover:opacity-70 transition-opacity"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
}
