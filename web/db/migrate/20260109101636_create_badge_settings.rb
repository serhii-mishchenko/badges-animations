class CreateBadgeSettings < ActiveRecord::Migration[7.1]
  def change
    create_table :badge_settings do |t|
      t.references :shop, null: false, foreign_key: true
      t.string :badge_name, null: false
      t.integer :position, default: 0
      t.string :product_id
      t.string :image_id

      t.timestamps
    end

    add_index :badge_settings, [:shop_id, :position]
    add_index :badge_settings, [:shop_id, :product_id]
  end
end
