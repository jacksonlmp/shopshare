/** Respostas da API Django (snake_case). */

export type ListMemberDto = {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  role: string;
  joined_at: number;
};

export type ListItemCategoryDto = {
  id: number;
  name: string;
  emoji: string;
};

export type ListItemDto = {
  id: string;
  list_id: string;
  name: string;
  is_checked: boolean;
  quantity?: number;
  unit?: string | null;
  note?: string | null;
  category?: ListItemCategoryDto | null;
  sort_order?: number;
  added_by?: string;
  checked_by?: string | null;
};

/** GET /api/lists/invite/:shareCode/ — público */
export type ShoppingListInvitePreviewDto = {
  name: string;
  description: string;
  share_code: string;
  owner_display_name: string;
  banner_color_hex?: string;
  banner_image_url?: string;
};

export type ShoppingListSummaryDto = {
  id: string;
  name: string;
  description?: string;
  banner_color_hex?: string;
  banner_image_url?: string;
  share_code: string;
  owner_id: string;
  is_archived: boolean;
  created_at: number;
  updated_at: number;
  my_role: string;
};

export type ShoppingListDetailDto = Omit<ShoppingListSummaryDto, 'my_role'> & {
  members: ListMemberDto[];
  items: ListItemDto[];
};
