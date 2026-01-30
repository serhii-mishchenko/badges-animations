# frozen_string_literal: true

class Shop < ActiveRecord::Base
  include ShopifyApp::ShopSessionStorage

  has_many :badge_settings, dependent: :destroy

  # Ensure settings defaults to empty hash
  attribute :settings, :jsonb, default: {}

  def api_version
    ShopifyApp.configuration.api_version
  end
end
