select properties.*, avg(property_reviews.rating)
from properties 
join property_reviews on properties.id = property_reviews.property_id
where properties.city like '%ancouver'
group by properties.id
having avg(property_reviews.rating) >= 4.0
order by properties.cost_per_night
limit 10;