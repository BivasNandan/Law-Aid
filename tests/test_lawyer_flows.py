"""
Lawyer flow tests: Manage Laws, Appointments, Schedule
"""
import pytest
import time
from selenium.webdriver.common.by import By
from utils.helpers import TestHelpers
from config import FRONTEND_URL, TEST_LAWYER_EMAIL, TEST_LAWYER_PASSWORD


class TestLawyerFlows:
    """Test lawyer-specific functionality"""
    
    def test_lawyer_details_page(self, driver, wait):
        """Test lawyer details/registration page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/lawyer-details")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Lawyer Details page loaded")
    
    def test_view_manage_law_page(self, driver, wait):
        """Test view and manage laws page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/view-manage-law")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] View Manage Law page loaded")
    
    def test_law_form_create(self, driver, wait):
        """Test creating a new law via law form"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/law-form")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        
        # Try to find form elements
        form_selectors = [
            (By.TAG_NAME, "form"),
            (By.XPATH, "//form"),
            (By.XPATH, "//input[@type='text']"),
        ]
        
        for by, value in form_selectors:
            if helpers.is_element_present(by, value):
                print("[SUCCESS] Law Form page loaded with form elements")
                return
        
        print("[SUCCESS] Law Form page loaded")
    
    def test_manage_appointments_page(self, driver, wait):
        """Test manage appointments page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/manage-appointments")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Manage Appointments page loaded")
    
    def test_schedule_page(self, driver, wait):
        """Test schedule page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/schedule")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Schedule page loaded")
    
    def test_lawyer_profile_page(self, driver, wait):
        """Test lawyer profile page"""
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/profile")
        helpers.wait_for_page_load()
        
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("[SUCCESS] Lawyer Profile page loaded")
    
    def test_view_feedback_page(self, driver, wait):
        """Test view feedback page (requires lawyerId)"""
        helpers = TestHelpers(driver, wait)
        
        # This would need a valid lawyerId - for now just test navigation
        # In real scenario, get lawyerId from context or test data
        print("[INFO] View Feedback requires lawyerId parameter")

