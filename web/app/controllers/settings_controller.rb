# frozen_string_literal: true

class SettingsController < AuthenticatedController
  # GET /api/settings/badge
  def badge
    shop = Shop.find_by(shopify_domain: current_shopify_session.shop)
    if shop.nil?
      render(json: { badge: "none" })
      return
    end

    # Get the default badge (no product_id or image_id specified)
    default_badge = shop.badge_settings.default_badges.ordered.first
    badge = default_badge&.badge_name || "none"
    
    render(json: { badge: badge })
  rescue StandardError => e
    logger.error("Failed to retrieve badge setting: #{e.message}")
    render(json: { success: false, error: e.message }, status: :internal_server_error)
  end

  # PUT /api/settings/badge
  def update_badge
    shop = Shop.find_by(shopify_domain: current_shopify_session.shop)
    if shop.nil?
      render(json: { success: false, error: "Shop not found" }, status: :not_found)
      return
    end

    badge_name = params[:badge] || "none"
    
    # Find or create the default badge setting (no product_id or image_id)
    badge_setting = shop.badge_settings.default_badges.first_or_initialize
    badge_setting.badge_name = badge_name
    badge_setting.position = 0
    
    if badge_setting.save
      render(json: { success: true, badge: badge_name })
    else
      render(json: { success: false, error: badge_setting.errors.full_messages.join(", ") }, status: :unprocessable_entity)
    end
  rescue StandardError => e
    logger.error("Failed to update badge setting: #{e.message}")
    render(json: { success: false, error: e.message }, status: :internal_server_error)
  end
end
