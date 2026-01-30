# frozen_string_literal: true

Rails.application.routes.draw do
  root to: "home#index"

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  scope path: :api, format: :json do
    # POST /api/products and GET /api/products/count
    resources :products, only: :create do
      collection do
        get :count
      end
    end
    # GET /api/settings/badge and PUT /api/settings/badge
    get "settings/badge", to: "settings#badge"
    put "settings/badge", to: "settings#update_badge"
    # GET /api/settings/app_embeds_status - Check if app embed block is enabled
    get "settings/app_embeds_status", to: "settings#app_embeds_status"
    # GET /api/settings/1 and PUT /api/settings/1 - Get and update shop settings
    get "settings/all", to: "settings#show"
    put "settings/all", to: "settings#update"
    namespace :webhooks do
      post "/app_uninstalled", to: "app_uninstalled#receive"
      post "/app_scopes_update", to: "app_scopes_update#receive"
      post "/customers_data_request", to: "customers_data_request#receive"
      post "/customers_redact", to: "customers_redact#receive"
      post "/shop_redact", to: "shop_redact#receive"
    end
  end

  mount ShopifyApp::Engine, at: "/api"
  get "/api", to: redirect(path: "/") # Needed because our engine root is /api but that breaks frontend routing

  # Public routes for Theme App Extension (accessible from storefront)
  # Must be defined BEFORE the catch-all route
  # GET /apps/badges/settings - Returns badge settings for the shop
  match "/apps/badges/settings", to: "public_badges#settings", via: [:get, :options], defaults: { format: :json }

  # If you are adding routes outside of the /api path, remember to also add a proxy rule for
  # them in web/frontend/vite.config.js

  # Any other routes will just render the react app
  match "*path" => "home#index", via: [:get, :post]
end
