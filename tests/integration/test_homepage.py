import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.fixture(scope="module")
def driver():
    """Set up a headless Chrome browser for integration testing."""
    options = Options()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


def test_homepage_loads(driver):
    """Verify that the Disaster Management System homepage loads successfully."""
    base = "http://localhost:4173"
    driver.get(base)
    assert "Disaster" in driver.title or "Disaster" in driver.page_source, \
        "Homepage failed to load or title missing"


def test_heading_present(driver):
    """Verify that the homepage contains the heading 'Disaster Management System'."""
    base = "http://localhost:4173"
    driver.get(base)

    # Wait until page source contains our heading text
    WebDriverWait(driver, 10).until(
        lambda d: "Disaster Management" in d.page_source
    )

    # Confirm text is indeed there
    assert "Disaster Management" in driver.page_source, \
        "Main heading text not found on homepage"

