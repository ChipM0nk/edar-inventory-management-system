package main

import (
	"log"
	"inventory-system/internal/auth"
	"inventory-system/internal/config"
	"inventory-system/internal/database"
	"inventory-system/internal/handlers"
	"inventory-system/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize JWT service
	jwtService := auth.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.RefreshSecret,
		cfg.JWT.AccessExpiry,
		cfg.JWT.RefreshExpiry,
	)

	// Initialize services
	userService := services.NewUserService(db)
	productService := services.NewProductService(db)
	stockService := services.NewStockService(db)
	categoryService := services.NewCategoryService(db)
	supplierService := services.NewSupplierService(db)
	warehouseService := services.NewWarehouseService(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, jwtService)
	productHandler := handlers.NewProductHandler(productService)
	stockHandler := handlers.NewStockHandler(stockService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	supplierHandler := handlers.NewSupplierHandler(supplierService)
	warehouseHandler := handlers.NewWarehouseHandler(warehouseService)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes (no authentication required)
		authRoutes := api.Group("/auth")
		{
			authRoutes.POST("/login", authHandler.Login)
			authRoutes.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(auth.AuthMiddleware(jwtService))
		{
			// User profile
			protected.GET("/profile", authHandler.GetProfile)

			// Products
			products := protected.Group("/products")
			{
				products.GET("", productHandler.ListProducts)
				products.POST("", productHandler.CreateProduct)
				products.GET("/:id", productHandler.GetProduct)
				products.PUT("/:id", productHandler.UpdateProduct)
				products.DELETE("/:id", productHandler.DeleteProduct)
			}


			// Categories
			categories := protected.Group("/categories")
			{
				categories.GET("", categoryHandler.ListCategories)
				categories.POST("", categoryHandler.CreateCategory)
				categories.GET("/:id", categoryHandler.GetCategory)
				categories.PUT("/:id", categoryHandler.UpdateCategory)
				categories.DELETE("/:id", categoryHandler.DeleteCategory)
			}

			// Suppliers
			suppliers := protected.Group("/suppliers")
			{
				suppliers.GET("", supplierHandler.ListSuppliers)
				suppliers.POST("", supplierHandler.CreateSupplier)
				suppliers.GET("/:id", supplierHandler.GetSupplier)
				suppliers.PUT("/:id", supplierHandler.UpdateSupplier)
				suppliers.DELETE("/:id", supplierHandler.DeleteSupplier)
			}

			// Warehouses
			warehouses := protected.Group("/warehouses")
			{
				warehouses.GET("", warehouseHandler.ListWarehouses)
				warehouses.POST("", warehouseHandler.CreateWarehouse)
				warehouses.GET("/:id", warehouseHandler.GetWarehouse)
				warehouses.PUT("/:id", warehouseHandler.UpdateWarehouse)
				warehouses.DELETE("/:id", warehouseHandler.DeleteWarehouse)
			}

			// Stock levels
			stock := protected.Group("/stock-levels")
			{
				stock.GET("", stockHandler.ListStockLevels)
				stock.GET("/:product_id/:warehouse_id", stockHandler.GetStockLevel)
			}

			// Stock movements
			movements := protected.Group("/stock-movements")
			{
				movements.GET("", stockHandler.ListStockMovements)
				movements.POST("", stockHandler.CreateStockMovement)
				movements.POST("/bulk", stockHandler.CreateBulkStockMovement)
			}

			// Products by supplier
			protected.GET("/products/supplier/:supplier_id", stockHandler.GetProductsBySupplier)

			// Reports
			reports := protected.Group("/reports")
			{
				reports.GET("/soh", stockHandler.GetSOHReport)
			}
		}
	}

	// Start server
	log.Printf("Server starting on %s:%s", cfg.Server.Host, cfg.Server.Port)
	if err := router.Run(cfg.Server.Host + ":" + cfg.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
