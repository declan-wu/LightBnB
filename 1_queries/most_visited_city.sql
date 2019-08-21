select properties.city, count(reservations.id) as total_visits
from properties
join reservations on reservations.property_id = properties.id 
group by properties.city
order by total_visits desc;