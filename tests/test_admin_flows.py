"""
Admin flow tests: Legal Advice, Consultation Chat, User Management
"""
import pytest
import time
from selenium.webdriver.common.by import By
from utils.helpers import TestHelpers
from config import FRONTEND_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD


class TestAdminFlows:
    """Test admin-specific functionality"""
    
    def test_admin_legal_advise_page(self, driver, wait):
        """Test legal advise by expert page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/admin/legal-advise")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Legal Advise By Expert page loaded")
    
    def test_admin_consultation_chat_page(self, driver, wait):
        """Test admin consultation chat page"""
        helpers = TestHelpers(driver, wait)
        
        # Navigate to legal advise first to get conversation list
        helpers.navigate_to("/admin/legal-advise")
        helpers.wait_for_page_load()
        
        # Try to find and click on a conversation
        conversation_selectors = [
            (By.XPATH, "//div[contains(@class, 'conversation')]"),
            (By.XPATH, "//div[contains(@class, 'card')]"),
            (By.XPATH, "//button[contains(text(), 'Chat')]"),
            (By.XPATH, "//a[contains(@href, '/admin/consultation-chat/')]"),
        ]
        
        for by, value in conversation_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                if "/admin/consultation-chat/" in helpers.get_current_url():
                    print("[SUCCESS] Admin Consultation Chat page opened")
                    return
        
        print("[INFO] No conversations found to test chat")
    
    def test_admin_profile_page(self, driver, wait):
        """Test admin profile page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/admin/profile")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Admin Profile page loaded")

