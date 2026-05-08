from sqlalchemy.orm import Session
from models.post import Post

def create_post(
    db: Session,
    fish: str,
    size: int,
    place: str,
    image_path: str
):
    post = Post(
        fish=fish,
        size=size,
        place=place,
        image_path=image_path
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

def get_posts(db: Session):
    return db.query(Post).order_by(Post.created_at.desc()).all()