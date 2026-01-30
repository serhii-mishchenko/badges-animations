# frozen_string_literal: true

class PublicBadgesController < ApplicationController
  # Public controller - no authentication required
  # Used by Theme App Extension to fetch badge settings from storefront
  skip_before_action :verify_authenticity_token
  
  # Allow CORS for storefront requests
  before_action :set_cors_headers

  # GET /apps/badges/settings
  # Returns badge settings for the current shop
  # Parameters:
  #   - shop: (optional) Shop domain, defaults to request host
  def settings
    # Handle OPTIONS preflight request
    if request.method == "OPTIONS"
      head :ok
      return
    end
    shop = find_shop_from_request
    
    if shop.nil?
      render json: { badge: "none", productBadges: {}, imageBadges: {} }
      return
    end

    # Get default badge
    default_badge = shop.badge_settings.default_badges.ordered.first
    default_badge_name = default_badge&.badge_name || "none"

    # Get product-specific badges
    product_badges = {}
    shop.badge_settings.where.not(product_id: nil).each do |setting|
      product_badges[setting.product_id] = setting.badge_name
    end

    # Get image-specific badges
    image_badges = {}
    shop.badge_settings.where.not(image_id: nil).each do |setting|
      image_badges[setting.image_id] = setting.badge_name
    end

    render json: {
      badge: default_badge_name,
      productBadges: product_badges,
      imageBadges: image_badges
    }
  rescue StandardError => e
    Rails.logger.error("PublicBadgesController error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { badge: "none", productBadges: {}, imageBadges: {} }
  end

  private

  def find_shop_from_request
    shop_domain = extract_shop_domain
    
    return nil if shop_domain.blank?

    # Normalize shop domain
    shop_domain = shop_domain.gsub(/\.myshopify\.com$/, "")
    shop_domain = "#{shop_domain}.myshopify.com" unless shop_domain.include?(".")

    Shop.find_by(shopify_domain: shop_domain)
  end

  def extract_shop_domain
    # Try multiple ways to get shop domain
    params[:shop] || 
      params[:shop_domain] ||
      request.headers["X-Shopify-Shop-Domain"] ||
      (request.host.include?("myshopify.com") ? request.host : nil)
  end

  def set_cors_headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
  end
end
