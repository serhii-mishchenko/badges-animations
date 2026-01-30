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

  # GET /api/settings/all
  # Returns the shop's settings
  def show
    shop = Shop.find_by(shopify_domain: current_shopify_session.shop)
    if shop.nil?
      render(json: { success: false, error: "Shop not found" }, status: :not_found)
      return
    end

    # Get settings from the shop's settings jsonb column
    settings = shop.settings || {}
    
    # Return settings in the format expected by the frontend
    render(json: {
      customer_portal_token: "",
      settings: {
        collapse_setup_guide: settings["collapse_setup_guide"] || false,
        hide_setup_guide: settings["hide_setup_guide"] || false,
      },
      shop_data: {
        shop_id: shop.id,
        shop_domain: shop.shopify_domain,
      }
    })
  rescue StandardError => e
    logger.error("Failed to retrieve settings: #{e.message}")
    render(json: { success: false, error: e.message }, status: :internal_server_error)
  end

  # PUT /api/settings/all
  # Updates the shop's settings
  def update
    shop = Shop.find_by(shopify_domain: current_shopify_session.shop)
    if shop.nil?
      render(json: { success: false, error: "Shop not found" }, status: :not_found)
      return
    end

    # Parse JSON body if needed
    request_body = request.body.read
    parsed_params = request_body.present? ? JSON.parse(request_body) : {}
    
    # Get settings from params
    # The frontend sends: { settings: { settings: { collapse_setup_guide: true, ... } } }
    settings_params = parsed_params.dig("settings", "settings") || params[:settings]&.dig(:settings) || {}
    
    # Log for debugging
    logger.info("Updating settings for shop #{shop.shopify_domain}")
    logger.info("Request body: #{request_body}")
    logger.info("Parsed params: #{parsed_params.inspect}")
    logger.info("Settings params: #{settings_params.inspect}")
    
    # Convert to hash with string keys and merge with existing settings
    current_settings = shop.settings || {}
    settings_hash = settings_params.is_a?(Hash) ? settings_params.stringify_keys : {}
    updated_settings = current_settings.merge(settings_hash)
    
    logger.info("Current settings: #{current_settings.inspect}")
    logger.info("Updated settings: #{updated_settings.inspect}")
    
    # Update the shop's settings
    if shop.update(settings: updated_settings)
      logger.info("Settings updated successfully in database")
      # Reload to get the actual saved values
      shop.reload
      render(json: {
        customer_portal_token: "",
        settings: {
          collapse_setup_guide: shop.settings["collapse_setup_guide"] || false,
          hide_setup_guide: shop.settings["hide_setup_guide"] || false,
        },
        shop_data: {
          shop_id: shop.id,
        }
      })
    else
      logger.error("Failed to update settings: #{shop.errors.full_messages.join(", ")}")
      render(json: { success: false, error: shop.errors.full_messages.join(", ") }, status: :unprocessable_entity)
    end
  rescue JSON::ParserError => e
    logger.error("Failed to parse JSON: #{e.message}")
    render(json: { success: false, error: "Invalid JSON: #{e.message}" }, status: :bad_request)
  rescue StandardError => e
    logger.error("Failed to update settings: #{e.message}")
    logger.error(e.backtrace.join("\n"))
    render(json: { success: false, error: e.message }, status: :internal_server_error)
  end

  # GET /api/settings/app_embeds_status
  # Checks if the badges-animation app embed block is enabled in the current theme
  def app_embeds_status
    shop = Shop.find_by(shopify_domain: current_shopify_session.shop)
    if shop.nil?
      render(json: { app_embeds_status: false, message: "Shop not found" })
      return
    end

    begin
      # Get the current theme using Shopify Admin API
      session = current_shopify_session
      client = ShopifyAPI::Clients::Rest::Admin.new(session: session)
      
      # Get the main theme (published theme)
      themes_response = client.get(path: "themes", query: { role: "main" })
      return render(json: { app_embeds_status: false, message: "Failed to get themes" }) unless themes_response.code == 200
      
      themes = themes_response.body["themes"]
      return render(json: { app_embeds_status: false, message: "No themes found" }) if themes.blank?
      
      main_theme = themes.first
      theme_id = main_theme["id"]
      
      # Get settings_data.json asset from the theme
      # According to docs, app embed blocks appear in settings_data.json
      asset_response = client.get(
        path: "themes/#{theme_id}/assets.json",
        query: { "asset[key]" => "config/settings_data.json" }
      )
      
      return render(json: { app_embeds_status: false, message: "Failed to get asset" }) unless asset_response.code == 200
      
      asset = asset_response.body["asset"]
      return render(json: { app_embeds_status: false, message: "Asset not found" }) unless asset && asset["value"]
      
      # Parse the JSON content
      settings_data = JSON.parse(asset["value"])
      
      # Check if app embed block is enabled
      # Block type format: "shopify://apps/<app_name>/blocks/<block_name>/<unique_ID>"
      # Our extension handle is "badges-animation"
      blocks = settings_data.dig("current", "blocks") || {}
      
      app_embed_enabled = blocks.any? do |_block_id, block_data|
        block_type = block_data["type"] || ""
        # Check if it's our app's embed block and not disabled
        block_type.include?("badges-animation") && block_data["disabled"] != true
      end
      
      render(json: { app_embeds_status: app_embed_enabled, message: "App embeds status checked successfully" })
    rescue JSON::ParserError => e
      logger.error("Failed to parse settings_data.json: #{e.message}")
      render(json: { app_embeds_status: false, message: "Failed to parse settings_data.json" })
    rescue StandardError => e
      logger.error("Failed to check app embeds status: #{e.message}")
      logger.error(e.backtrace.join("\n"))
      render(json: { app_embeds_status: false, message: "Failed to check app embeds status" })
    end
  end
end
