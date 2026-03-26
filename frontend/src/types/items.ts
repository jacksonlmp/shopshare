/** Categorias e sugestões — API de itens */

export type CategoryDto = {
  id: number;
  name: string;
  emoji: string;
  color_hex: string;
};

export type ItemSuggestionDto = {
  item_name: string;
  times_added: number;
  last_used_at: number;
  category: CategoryDto | null;
};
