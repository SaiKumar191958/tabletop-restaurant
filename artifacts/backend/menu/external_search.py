import json
import urllib.error
import urllib.parse
import urllib.request

THEMEALDB_SEARCH = 'https://www.themealdb.com/api/json/v1/1/search.php'

# Map TheMealDB categories to our menu category names (seed_demo categories)
CATEGORY_HINTS = {
    'beef': 'Burgers',
    'chicken': 'Burgers',
    'lamb': 'Burgers',
    'pork': 'Burgers',
    'pasta': 'Pasta',
    'seafood': 'Salads',
    'vegetarian': 'Salads',
    'vegan': 'Salads',
    'starter': 'Salads',
    'side': 'Salads',
    'dessert': 'Desserts',
    'breakfast': 'Drinks',
    'miscellaneous': 'Burgers',
    'goat': 'Burgers',
}


def _suggest_category(meal_category: str) -> str:
    key = (meal_category or '').strip().lower()
    return CATEGORY_HINTS.get(key, 'Burgers')


def _truncate(text: str, max_len: int = 280) -> str:
    text = ' '.join((text or '').split())
    if len(text) <= max_len:
        return text
    return text[: max_len - 3].rstrip() + '...'


def search_external_foods(query: str, limit: int = 8) -> list[dict]:
    query = (query or '').strip()
    if len(query) < 2:
        return []

    url = f'{THEMEALDB_SEARCH}?s={urllib.parse.quote(query)}'
    request = urllib.request.Request(url, headers={'User-Agent': 'TableTop-Restaurant-App/1.0'})

    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return []

    meals = payload.get('meals') or []
    results = []

    for meal in meals[:limit]:
        name = meal.get('strMeal') or ''
        if not name:
            continue

        thumb = meal.get('strMealThumb') or ''
        category = meal.get('strCategory') or ''
        area = meal.get('strArea') or ''
        tags = meal.get('strTags') or ''

        description_parts = []
        if area:
            description_parts.append(f'{area} cuisine.')
        if tags:
            description_parts.append(f'Tags: {tags.replace(",", ", ")}.')
        instructions = meal.get('strInstructions') or ''
        if instructions:
            description_parts.append(_truncate(instructions, 200))

        description = ' '.join(description_parts) or f'Delicious {name}.'

        # Guess veg / nonveg from category and tags
        combined = f'{category} {tags}'.lower()
        if 'vegetarian' in combined or 'vegan' in combined:
            food_type = 'veg'
        else:
            food_type = 'nonveg'

        results.append({
            'source': 'themealdb',
            'external_id': meal.get('idMeal'),
            'name': name,
            'description': _truncate(description, 300),
            'image_url': thumb,
            'suggested_category': _suggest_category(category),
            'meal_category': category,
            'food_type': food_type,
        })

    return results
