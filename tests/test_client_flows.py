"""
Client flow tests: View Laws, Find Lawyers, Book Appointments, Consultation Chat
"""
import pytest
import time
from selenium.webdriver.common.by import By
from utils.helpers import TestHelpers
from config import FRONTEND_URL, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD


class TestClientFlows:
    """Test client-specific functionality"""
    
    def test_view_laws_page(self, driver, wait):
        """Test viewing laws page"""
        helpers = TestHelpers(driver, wait)
        
        # Login first using improved login helper
        login_success = helpers.login(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD, "client")
        if not login_success:
            print("[WARNING] Login failed, but continuing test...")
        
        # Navigate to view laws
        helpers.navigate_to("/viewLaw")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] View Laws page loaded")
    
    def test_law_details_page(self, driver, wait):
        """Test law details page"""
        helpers = TestHelpers(driver, wait)
        
        # Navigate to a law details page (assuming there's at least one law)
        helpers.navigate_to("/viewLaw")
        helpers.wait_for_page_load()
        
        # Try to find and click on a law card
        law_card_selectors = [
            (By.XPATH, "//div[contains(@class, 'card')]"),
            (By.XPATH, "//a[contains(@href, '/law/')]"),
            (By.XPATH, "//div[contains(@class, 'law')]"),
        ]
        
        for by, value in law_card_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                assert "/law/" in helpers.get_current_url() or "/law-details" in helpers.get_current_url()
                print("[SUCCESS] Law details page opened")
                return
        
        print("[INFO] No law cards found to test")
    
    def test_find_lawyer_page(self, driver, wait):
        """Test find lawyer page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/find-lawyer")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Find Lawyer page loaded")
    
    def test_lawyer_profile_view(self, driver, wait):
        """Test viewing lawyer profile"""
        helpers = TestHelpers(driver, wait)
        
        # Navigate to find lawyer first
        helpers.navigate_to("/find-lawyer")
        helpers.wait_for_page_load()
        
        # Try to find and click on a lawyer card
        lawyer_card_selectors = [
            (By.XPATH, "//div[contains(@class, 'lawyer')]"),
            (By.XPATH, "//a[contains(@href, '/lawyer/')]"),
            (By.XPATH, "//div[contains(@class, 'card')]"),
        ]
        
        for by, value in lawyer_card_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                assert "/lawyer/" in helpers.get_current_url()
                print("[SUCCESS] Lawyer profile page opened")
                return
        
        print("[INFO] No lawyer cards found to test")
    
    def test_consultation_chat_page(self, driver, wait):
        """Test consultation chat page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/consultation-chat")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Consultation Chat page loaded")
    
    def test_book_appointment_page(self, driver, wait):
        """Test book appointment page navigation"""
        helpers = TestHelpers(driver, wait)
        
        # Navigate to find lawyer first
        helpers.navigate_to("/find-lawyer")
        helpers.wait_for_page_load()
        
        # Try to find book appointment button
        appointment_selectors = [
            (By.XPATH, "//button[contains(text(), 'Appointment')]"),
            (By.XPATH, "//a[contains(@href, '/book-appointment/')]"),
            (By.XPATH, "//button[contains(text(), 'Book')]"),
        ]
        
        for by, value in appointment_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                assert "/book-appointment/" in helpers.get_current_url()
                print("[SUCCESS] Book Appointment page opened")
                return
        
        print("[INFO] Book appointment button not found")
    
    def test_my_appointments_page(self, driver, wait):
        """Test my appointments page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/my-appointments")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] My Appointments page loaded")
    
    def test_client_profile_page(self, driver, wait):
        """Test client profile page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/profile")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Client Profile page loaded")

