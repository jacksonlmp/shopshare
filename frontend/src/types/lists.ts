/** Respostas da API Django (snake_case). */

export type ListMemberDto = {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  role: string;
  joined_at: number;
};

export type ListItemDto = {
  id: string;
  list_id: string;
  name: string;
  is_checked: boolean;
  quantity?: string;
  unit?: string;
  category?: string;
  sort_order?: number;
};

/** GET /api/lists/invite/:shareCode/ — público */
export type ShoppingListInvitePreviewDto = {
  name: string;
  description: string;
  share_code: string;
  owner_display_name: string;
};

export type ShoppingListSummaryDto = {
  id: string;
  name: string;
  description?: string;
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
