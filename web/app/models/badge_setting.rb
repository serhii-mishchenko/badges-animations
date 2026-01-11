# frozen_string_literal: true

class BadgeSetting < ActiveRecord::Base
  belongs_to :shop

  validates :badge_name, presence: true
  validates :badge_name, inclusion: { 
    in: %w[none best eco exclusive handmade limited new preorder sale top],
    message: "is not a valid badge name" 
  }

  scope :for_shop, ->(shop) { where(shop: shop) }
  scope :default_badges, -> { where(product_id: nil, image_id: nil) }
  scope :ordered, -> { order(:position, :created_at) }
end
