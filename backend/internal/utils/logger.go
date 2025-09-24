package utils

import (
	"log"
	"os"
)

// DebugLog writes debug information to a centralized log file
func DebugLog(functionName, message string, data interface{}) {
	// Create log directory if it doesn't exist
	if err := os.MkdirAll("log", 0755); err != nil {
		log.Printf("Failed to create log directory: %v", err)
		return
	}
	
	// Open log file in append mode
	logFile, err := os.OpenFile("log/service.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("Failed to open log file: %v", err)
		return
	}
	defer logFile.Close()
	
	debugLogger := log.New(logFile, "[DEBUG] ", log.LstdFlags)
	debugLogger.Printf("[%s] %s: %+v", functionName, message, data)
}
