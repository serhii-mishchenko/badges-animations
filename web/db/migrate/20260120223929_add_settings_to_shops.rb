class AddSettingsToShops < ActiveRecord::Migration[7.1]
  def change
    add_column :shops, :settings, :jsonb, default: {}
  end
end
